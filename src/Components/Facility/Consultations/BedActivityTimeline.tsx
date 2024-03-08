import Chip from "../../../CAREUI/display/Chip";
import Timeline, {
  TimelineEvent,
  TimelineNode,
  TimelineNodeTitle,
} from "../../../CAREUI/display/Timeline";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { classNames, formatDateTime, relativeTime } from "../../../Utils/utils";
import { AssetData } from "../../Assets/AssetTypes";
import { CurrentBed } from "../models";
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface AssetDiff {
  newlyLinkedAssets: AssetData[];
  existingAssets: AssetData[];
  unlinkedAssets: AssetData[];
}

const getAssetDiff = (a: AssetData[], b: AssetData[]): AssetDiff => {
  const newlyLinkedAssets: AssetData[] = [];
  const existingAssets: AssetData[] = [];
  const unlinkedAssets: AssetData[] = [];

  const bMap: Map<string, AssetData> = new Map();
  b.forEach((asset) => bMap.set(asset.id, asset));
  a.forEach((asset) => {
    if (!bMap.has(asset.id)) {
      unlinkedAssets.push(asset);
    } else {
      existingAssets.push(asset);
    }
  });
  b.forEach((asset) => {
    if (!a.find((aAsset) => aAsset.id === asset.id)) {
      newlyLinkedAssets.push(asset);
    }
  });

  return {
    newlyLinkedAssets,
    existingAssets,
    unlinkedAssets,
  };
};

interface Props {
  consultationBeds: CurrentBed[];
  loading?: boolean;
}

export default function BedActivityTimeline({
  consultationBeds,
  loading,
}: Props) {
  return (
    <>
      <Timeline
        className={classNames(
          "py-4 md:px-3",
          loading && "animate-pulse opacity-70"
        )}
        name="bed-allocation"
      >
        {consultationBeds.map((bed, index) => {
          return (
            <BedAllocationNode
              key={`activity-${bed.id}`}
              bed={bed}
              prevBed={consultationBeds[index + 1] ?? undefined}
              isLastNode={index === consultationBeds.length - 1}
            />
          );
        })}
      </Timeline>
    </>
  );
}

const BedAllocationNode = ({
  bed,
  prevBed,
  isLastNode,
}: {
  bed: CurrentBed;
  prevBed?: CurrentBed;
  isLastNode: boolean;
}) => {
  const event: TimelineEvent = {
    type: "allocated",
    timestamp: bed.start_date,
    by: undefined,
    icon: bed.end_date === null ? "l-map-pin-alt" : "l-bed",
    notes: bed.assets_objects ? (
      <BedTimelineAsset
        assets={bed.assets_objects}
        prevBedAssets={prevBed?.assets_objects}
      />
    ) : (
      ""
    ),
  };

  return (
    <>
      <TimelineNode
        name="bed"
        event={event}
        title={
          <BedTimelineNodeTitle
            event={event}
            titleSuffix={<BedTitleSuffix bed={bed} prevBed={prevBed} />}
            bed={bed}
          />
        }
        isLast={isLastNode}
      />
    </>
  );
};

const BedTimelineAsset = ({
  assets,
  prevBedAssets,
}: {
  assets: AssetData[];
  prevBedAssets?: AssetData[];
}) => {
  const { newlyLinkedAssets, existingAssets, unlinkedAssets } = getAssetDiff(
    prevBedAssets || [],
    assets
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col">
        {newlyLinkedAssets.length !== 0 && (
          <ul className="text-sm text-gray-600">Newly Linked Assets</ul>
        )}
        {newlyLinkedAssets.map((asset) => (
          <li key={asset.id} className="list-disc text-xs text-gray-600">
            {asset.name}
          </li>
        ))}
        {existingAssets.length !== 0 && (
          <ul className="text-sm text-gray-600">Existing Assets</ul>
        )}
        {existingAssets.map((asset) => (
          <li key={asset.id} className="list-disc text-xs text-gray-600">
            {asset.name}
          </li>
        ))}
        {unlinkedAssets.length !== 0 && (
          <ul className="text-sm text-gray-600">Unlinked Assets</ul>
        )}
        {unlinkedAssets.map((asset) => (
          <li key={asset.id} className="list-disc text-xs text-gray-600">
            {asset.name}
          </li>
        ))}
      </div>
    </div>
  );
};

const BedTimelineNodeTitle = (props: {
  event: TimelineEvent;
  titleSuffix: React.ReactNode;
  bed: CurrentBed;
}) => {
  const { event, titleSuffix, bed } = props;

  return (
    <TimelineNodeTitle event={event}>
      <div className="flex w-full justify-between gap-2">
        <p className="flex-auto py-0.5 text-xs leading-5 text-gray-600 md:w-2/3">
          {titleSuffix}
        </p>
        <div className="md:w-fit">
          <BedActivityIButtonPopover bed={bed} />
        </div>
      </div>
    </TimelineNodeTitle>
  );
};

const BedTitleSuffix = ({
  bed,
  prevBed,
}: {
  bed: CurrentBed;
  isLastNode?: boolean;
  prevBed?: CurrentBed;
}) => {
  return (
    <div className="flex flex-col">
      <div className="flex gap-x-2">
        <span>{formatDateTime(bed.start_date).split(";")[0]}</span>
        <span className="text-gray-500">-</span>
        <span>{formatDateTime(bed.start_date).split(";")[1]}</span>
      </div>
      <p>
        {bed.bed_object.id === prevBed?.bed_object.id
          ? "Asset changed in" + " "
          : "Transferred to" + " "}
        <span className="font-semibold">{`${bed.bed_object.name} (${bed.bed_object.bed_type}) in ${bed.bed_object.location_object?.name}`}</span>
        {bed.end_date === null ? (
          <Chip
            text="In Use"
            startIcon="l-notes"
            size="small"
            variant="primary"
            className="ml-5"
          />
        ) : (
          ""
        )}
      </p>
    </div>
  );
};

const BedActivityIButtonPopover = ({
  bed,
}: {
  event?: TimelineEvent;
  bed?: CurrentBed;
}) => {
  return (
    <Popover className="relative text-sm text-gray-500 md:text-base">
      <Popover.Button>
        <CareIcon className="care-l-info-circle cursor-pointer text-gray-500 hover:text-gray-600" />
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute z-10 -ml-32 mt-2 w-64 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
          <p className="text-xs text-gray-600">
            {relativeTime(bed?.start_date)}
          </p>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
